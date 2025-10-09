import { userDetailsDto } from '../dtos/user-details-dto';

export interface CachedOtpType {
  userDetails: userDetailsDto;
  otp: string;
}
