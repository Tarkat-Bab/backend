import { SetMetadata } from '@nestjs/common';
import { SKIP_LOCATION_CHECK } from '../guards/location-coverage.guard';

export const SkipLocationCheck = () => SetMetadata(SKIP_LOCATION_CHECK, true);
