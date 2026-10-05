import { CarDriveLoader } from '@/components/cars/CarDriveLoader';

/**
 * Route-level loader shown by Next.js while the car detail segment loads.
 * Same driving-car scene as the in-page loader for a consistent feel.
 */
export default function CarLoading() {
  return <CarDriveLoader />;
}
