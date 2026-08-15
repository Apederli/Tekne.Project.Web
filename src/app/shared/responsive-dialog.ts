// Mobilde tam ekran, sm üstünde ortalanmış kutu; genişliği çağıran ekler
// (örn. `sm:w-[42rem]`). Genişlik w ile verilir — CDK paneli içeriğe göre
// daralır, max-w yalnız tavan olurdu. Taban max-w-none + sm:max-w-none,
// Helm'in max-w sınırlarını variant bazında ezmek için şart.
export const RESPONSIVE_DIALOG_CLASS =
  'fixed inset-0 max-w-none content-start overflow-y-auto rounded-none ' +
  'data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 ' +
  'sm:static sm:inset-auto sm:max-w-none sm:content-normal sm:rounded-xl sm:p-6';
