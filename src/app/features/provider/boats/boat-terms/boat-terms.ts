import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmLabel } from '@ui/label';
import { AppSingleCheckGroup } from '../../../../shared/forms/app-single-check-group';
import { SelectOption, UsageTermGroupOutputModel } from '@models';
import { BoatService, BoatUsageTermService, UsageTermService } from '@services';

/** Bir grup ve altındaki şartlar — şablonun çizdiği birim. */
interface TermGroup {
  group: UsageTermGroupOutputModel;
  options: SelectOption<number>[];
  termIds: number[];
}

/**
 * Arka arkaya tıklamada her tık ayrı istek atmasın diye. `switchMap` ile
 * birlikte, tampon süresi dolmadan gelen tıklar tek isteğe birleşir.
 */
const SAVE_DEBOUNCE_MS = 300;

/**
 * Düzenleme sayfasının "Şartlar" sekmesi.
 *
 * İki kaynağı birleştirir: katalog (`GET /api/UsageTerms`, teknenin kiralama
 * tipine göre süzülü) ve teknenin işaretleri (`GET /api/Boats/{id}` içindeki
 * `usageTerms`). Katalog tekneye bağımlı olduğu için tekne gelmeden istenmez.
 *
 * Kaydet butonu yok — her değişiklik otomatik `PUT` edilir. Uç tam eşitleme
 * yaptığı için her seferinde listenin tamamı gider.
 */
@Component({
  selector: 'app-boat-terms',
  imports: [AppSingleCheckGroup, HlmCheckboxImports, HlmLabel],
  templateUrl: './boat-terms.html',
})
export class BoatTerms {
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);
  usageTermService = inject(UsageTermService);
  boatUsageTermService = inject(BoatUsageTermService);

  /**
   * Sekme olduğu için route paramı input'a bağlanmıyor; kapsayıcının
   * route'undan okunur (`withComponentInputBinding` yalnızca route'a bağlı
   * bileşenlere işler).
   */
  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

  boatResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.boatService.getById(params),
  });

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /**
   * Katalog teknenin kiralama tipiyle süzülür — tekneye uygulanamayacak şartlar
   * hiç listelenmesin. Tekne gelmeden `params` `undefined` döner ve istek
   * atılmaz.
   */
  catalogResource = rxResource({
    params: () => this.boat()?.rentalType,
    stream: ({ params }) => this.usageTermService.getList(params),
  });

  catalog = computed(() => (this.catalogResource.hasValue() ? this.catalogResource.value() : []));

  loading = computed(() => this.boatResource.isLoading() || this.catalogResource.isLoading());
  failed = computed(
    () => this.boatResource.status() === 'error' || this.catalogResource.status() === 'error',
  );

  /** Ekrandaki seçim. Tekne yeniden yüklenirse sunucudaki hâle döner. */
  selectedIds = linkedSignal<number[]>(() => (this.boat()?.usageTerms ?? []).map((t) => t.id));

  /**
   * Sunucudaki son bilinen seçim. Kayıt hata verirse ekran buraya geri alınır —
   * kullanıcı kaydedilmemiş bir seçime bakmaya devam etmesin.
   */
  serverIds = linkedSignal<number[]>(() => (this.boat()?.usageTerms ?? []).map((t) => t.id));

  selected = computed(() => new Set(this.selectedIds()));

  /** Grubu olmayan şartlar — checkbox, düz liste. */
  ungroupedTerms = computed(() => this.catalog().filter((t) => !t.group));

  /** Grubu olan şartlar, gruplarına toplanmış — her grup bir radio kümesi. */
  termGroups = computed<TermGroup[]>(() => {
    const groups = new Map<number, TermGroup>();
    for (const term of this.catalog()) {
      if (!term.group) continue;
      const entry = groups.get(term.group.id);
      if (entry) {
        entry.options.push({ value: term.id, label: term.name });
        entry.termIds.push(term.id);
      } else {
        groups.set(term.group.id, {
          group: term.group,
          options: [{ value: term.id, label: term.name }],
          termIds: [term.id],
        });
      }
    }
    return [...groups.values()].sort((a, b) => a.group.order - b.group.order);
  });

  /** Grup id → o gruptan seçili şartın id'si (yoksa `null`). Kümenin değeri. */
  selectionByGroup = computed(() => {
    const selected = this.selected();
    const map = new Map<number, number | null>();
    for (const { group, termIds } of this.termGroups()) {
      map.set(group.id, termIds.find((id) => selected.has(id)) ?? null);
    }
    return map;
  });

  /**
   * Teknede işaretli ama katalogda olmayan şartlar — admin pasifleştirmiş
   * demektir. Gösterilmezlerse sonraki kayıtta sessizce silinirler, o yüzden
   * ayrı blokta listelenir. Katalog yüklenmeden hesaplanmaz; aksi hâlde yükleme
   * sırasında tüm işaretler "geçersiz" görünürdü.
   */
  retiredTerms = computed(() => {
    if (!this.catalogResource.hasValue()) return [];
    const inCatalog = new Set(this.catalog().map((t) => t.id));
    return (this.boat()?.usageTerms ?? []).filter((t) => !inCatalog.has(t.id));
  });

  empty = computed(() => this.catalog().length === 0 && this.retiredTerms().length === 0);

  saveRequests = new Subject<number[]>();

  constructor() {
    this.saveRequests
      .pipe(
        debounceTime(SAVE_DEBOUNCE_MS),
        switchMap((ids) => {
          const boatId = this.boat()?.id;
          if (!boatId) return of(null);
          return this.boatUsageTermService.set(boatId, ids).pipe(
            map(() => ids),
            // Hata mesajını interceptor gösteriyor; buradaki tek iş, ekranı
            // kaydedilemeyen bir seçimde bırakmamak.
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((ids) => {
        if (ids) this.serverIds.set(ids);
        else this.selectedIds.set(this.serverIds());
      });
  }

  isSelected(termId: number): boolean {
    return this.selected().has(termId);
  }

  /** Grubu olmayan şart — bağımsız işaretlenir. */
  onTermToggle(termId: number, checked: boolean): void {
    const next = checked
      ? [...this.selectedIds(), termId]
      : this.selectedIds().filter((id) => id !== termId);
    this.apply(next);
  }

  /**
   * Grup seçimi. Aynı gruptan yalnızca biri işaretli kalabilir, bu yüzden
   * grubun tüm şartları önce listeden düşürülür. `null` = gruptan hiçbiri;
   * kullanıcı seçili olana tekrar bastığında gelir.
   */
  onGroupChange(entry: TermGroup, termId: number | null): void {
    const groupTermIds = new Set(entry.termIds);
    const next = this.selectedIds().filter((id) => !groupTermIds.has(id));
    if (termId !== null) next.push(termId);
    this.apply(next);
  }

  apply(ids: number[]): void {
    this.selectedIds.set(ids);
    this.saveRequests.next(ids);
  }
}
