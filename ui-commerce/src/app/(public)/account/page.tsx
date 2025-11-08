import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AccountClient from './AccountClient';

export const metadata = {
  title: 'Tài khoản - LOSIA Store',
  description: 'Quản lý thông tin tài khoản của bạn',
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/account');
  }

  return <AccountClient />;
}

