import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { OrderSuccessView } from '@/components/success/OrderSuccessView';

interface Props {
  params: { orderId: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Order Confirmed — #${params.orderId} | AETHERIA`,
    description: 'Your license key is ready. Copy your key and follow the activation guide.',
    robots: { index: false, follow: false },
  };
}

export default async function OrderSuccessPage({ params }: Props) {
  const { orderId } = params;

  // Fetch initial order state from Firestore
  const order = await getOrderById(orderId);

  if (!order) {
    return notFound();
  }

  const publicOrder = toOrderPublic(order);

  return <OrderSuccessView initialOrder={publicOrder} orderId={orderId} />;
}
