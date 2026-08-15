import { BoatType } from '@enums/boat-type';
import { HullMaterial } from '@enums/hull-material';
import { PaymentMethod } from '@enums/payment-method';
import { RentalType } from '@enums/rental-type';
import { AmenityOutputModel } from '@models/amenity';
import { BoatPhotoOutputModel } from '@models/boat-photo';
import { UsageTermOutputModel } from '@models/usage-term';

export interface BoatInputModel {
  name: string;
  boatType: BoatType;
  rentalType: RentalType;
  manufactureYear?: number;
  lengthInMeters: number;
  diningCapacity: number;
  totalCapacity: number;
  swimmingCapacity: number;
  toiletCount: number;
  minimumRentalDuration?: number;
  brandId: number;
  modelId: number;
  hullMaterial?: HullMaterial;
  remainingPaymentMethods: PaymentMethod[];
  cityId: number;
  primaryHarborId: number;
  harborIds: number[];
  description?: string;
}

export interface BoatFormModel {
  name: string;
  boatType: BoatType | '';
  rentalType: RentalType | '';
  manufactureYear: number | null;
  lengthInMeters: number | null;
  diningCapacity: number | null;
  totalCapacity: number | null;
  swimmingCapacity: number | null;
  toiletCount: number | null;
  minimumRentalDuration: number | null;
  brandId: string;
  modelId: string;
  hullMaterial: HullMaterial | '';
  remainingPaymentMethods: PaymentMethod[];
  cityId: string;
  primaryHarborId: string;
  harborIds: number[];
  description: string;
}

export interface BoatListFilterInputModel {
  cityId?: number;
  harborId?: number;
  date?: string;
  startHour?: number;
  hours?: number;
  numberOfPeople?: number;
  rentalType?: RentalType;
  /** 1'den başlar; gönderilmezse backend ilk sayfayı döner. Sayfa boyutu sunucuda sabit. */
  pageNumber?: number;
}

export interface BoatCardOutputModel {
  id: number;
  name: string;
  boatTypeLabel: string;
  totalCapacity: number;
  primaryHarborName: string;
  cityName: string;
  photos: string[];
  isFavorite: boolean;
  rate?: number;
  rateUnitLabel: string;
}

export interface BoatOutputModel {
  id: number;
  name: string;
  boatType: BoatType;
  boatTypeLabel: string;
  rentalType: RentalType;
  rentalTypeLabel: string;
  manufactureYear?: number;
  lengthInMeters: number;
  diningCapacity: number;
  totalCapacity: number;
  swimmingCapacity: number;
  toiletCount: number;
  minimumRentalDuration: number;
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  hullMaterial?: HullMaterial;
  hullMaterialLabel?: string;
  remainingPaymentMethods: PaymentMethod[];
  remainingPaymentMethodLabels: string[];
  cityId: number;
  primaryHarborId: number;
  harborIds: number[];
  ownerId: number;
  description?: string;
  isActive: boolean;
  photos: BoatPhotoOutputModel[];
  usageTerms?: UsageTermOutputModel[];
  amenities?: AmenityOutputModel[];
}
