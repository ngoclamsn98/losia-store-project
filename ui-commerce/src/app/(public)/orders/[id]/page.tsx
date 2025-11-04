import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import OrderDetailClient from './OrderDetailClient';

export const metadata = {
  title: 'Order Details - LOSIA Store',
  description: 'View your order details',
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/orders/' + params.id);
  }

  return <OrderDetailClient orderId={params.id} />;
}

