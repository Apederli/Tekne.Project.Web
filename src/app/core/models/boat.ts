import { BoatType } from '@enums/boat-type';
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
  cityId: string;
  primaryHarborId: string;
  harborIds: number[];
  description: string;
}

export interface BoatListFilterInputModel {
  harborId?: number;
}

export interface BoatCardOutputModel {
  id: number;
  name: string;
  boatType: BoatType;
  boatTypeLabel: string;
  totalCapacity: number;
  primaryHarborId: number;
  primaryHarborName: string;
  cityName: string;
  photos: string[];
  isFavorite: boolean;
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
