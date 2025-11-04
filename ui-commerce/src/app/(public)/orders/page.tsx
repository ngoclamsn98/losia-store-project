import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'My Orders - LOSIA Store',
  description: 'View your order history',
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/orders');
  }

  return <OrdersClient />;
}

