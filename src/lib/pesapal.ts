// Pesapal integration removed - using Mobile Money payments
export async function getTransactionStatus(
  _consumerKey: string,
  _consumerSecret: string,
  _orderTrackingId: string
): Promise<{ status_code: number; payment_status_description: string; amount: number }> {
  return { status_code: 0, payment_status_description: 'Not implemented', amount: 0 }
}

export async function submitOrder(
  _consumerKey: string,
  _consumerSecret: string,
  _params: any
): Promise<{ order_tracking_id: string; redirect_url: string }> {
  throw new Error('Pesapal integration removed. Using Mobile Money.')
}
