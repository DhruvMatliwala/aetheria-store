import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/firestore/orders';
import { verifyApprovalToken } from '@/lib/orders/approvalToken';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId')?.trim();
  const token = searchParams.get('token')?.trim();

  if (!orderId || !token) {
    return new NextResponse('Missing parameters.', { status: 400 });
  }

  // 1. Verify HMAC Token
  if (!verifyApprovalToken(orderId, token)) {
    return new NextResponse('Unauthorized token.', { status: 401 });
  }

  try {
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return new NextResponse('Order not found.', { status: 404 });
    }

    if (existingOrder.payment_status === 'paid') {
      return new NextResponse('Cannot reject an order that has already been approved and fulfilled.', { status: 400 });
    }

    // Mark as failed / rejected
    const db = getAdminFirestore();
    await db.collection('orders').doc(orderId).update({
      payment_status: 'failed',
      updated_at: new Date(),
    });

    return new NextResponse(
      renderHtml(
        'Order Rejected',
        `Order #${orderId} has been marked as rejected / unpaid. No key was allocated.`,
        false
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (err: any) {
    console.error('[quick-reject] Error:', err);
    return new NextResponse('Failed to reject order: ' + err?.message, { status: 500 });
  }
}

function renderHtml(title: string, message: string, success: boolean): string {
  const accentColor = success ? '#06b6d4' : '#ef4444';
  const icon = success ? '✅' : '❌';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — AETHERIA Vault</title>
  <style>
    body {
      background-color: #050508;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #0f111a;
      border: 1px solid ${accentColor}44;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 40px ${accentColor}22;
    }
    .icon {
      font-size: 44px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 14px 0;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      background: #27272a;
      color: #fff;
      font-weight: bold;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/admin" class="btn">Open Admin Dashboard</a>
  </div>
</body>
</html>`;
}
