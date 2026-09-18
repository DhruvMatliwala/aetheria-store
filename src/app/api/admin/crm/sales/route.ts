import { NextRequest, NextResponse } from 'next/server';
import { getAllCrmSales, saveCrmSale, updateCrmSale, deleteCrmSale, CrmSale } from '@/lib/firestore/crmSales';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const sales = await getAllCrmSales();
    return NextResponse.json({ sales });
  } catch (err: any) {
    console.error('[api/admin/crm/sales] GET error:', err.message);
    return NextResponse.json({ error: 'Failed to retrieve sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (Array.isArray(body.sales)) {
      // Bulk sync
      for (const item of body.sales) {
        if (item && item.id) {
          await saveCrmSale(item);
        }
      }
      return NextResponse.json({ success: true, count: body.sales.length });
    }

    if (!body || !body.id) {
      return NextResponse.json({ error: 'Sale record with id is required.' }, { status: 400 });
    }

    const sale: CrmSale = {
      id: String(body.id),
      customerName: String(body.customerName || '').trim(),
      plan: String(body.plan || '1 Device (Standard)').trim(),
      platform: String(body.platform || 'Telegram').trim(),
      contact: String(body.contact || '').trim(),
      sourceEmail: String(body.sourceEmail || '').trim(),
      soldAt: String(body.soldAt || new Date().toISOString()),
      expiresAt: String(body.expiresAt || new Date().toISOString()),
      reminderAt: String(body.reminderAt || new Date().toISOString()),
      reminded: Boolean(body.reminded),
      status: body.status || 'active',
      amountPaid: typeof body.amountPaid === 'number' ? body.amountPaid : undefined,
      cost: typeof body.cost === 'number' ? body.cost : undefined,
      profit: typeof body.profit === 'number' ? body.profit : undefined,
      discountType: body.discountType || undefined,
      trackProfit: body.trackProfit === true,
    };

    const saved = await saveCrmSale(sale);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to persist sale to Firestore' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sale });
  } catch (err: any) {
    console.error('[api/admin/crm/sales] POST error:', err.message);
    return NextResponse.json({ error: 'Failed to save sale' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body.id || request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sale id is required for update.' }, { status: 400 });
    }

    const updated = await updateCrmSale(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update sale in Firestore' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/admin/crm/sales] PUT error:', err.message);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id || request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sale id is required for deletion.' }, { status: 400 });
    }

    const deleted = await deleteCrmSale(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete sale from Firestore' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/admin/crm/sales] DELETE error:', err.message);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
