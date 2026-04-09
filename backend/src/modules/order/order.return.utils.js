import { getPublicOrderId } from '../../utils/orderId.utils.js';

export const processReturnRefundIfNeeded = async (order) => {
  if (String(order.paymentStatus || '').toLowerCase() === 'refunded') {
    return {
      refunded: false,
      refundedAmountPaise: Math.round(Number(order.totalAmount || 0) * 100),
      alreadyRefunded: true,
      refundId: null,
    };
  }

  if (String(order.paymentStatus || '').toLowerCase() !== 'paid') {
    return {
      refunded: false,
      refundedAmountPaise: 0,
      alreadyRefunded: false,
      skipped: true,
      refundId: null,
    };
  }

  const { processRefundService } = await import('../payment/payment.service.js');
  const result = await processRefundService({
    orderId: String(order._id),
    customerId: String(order.customerId),
    reason: 'Return received and refund completed',
  });

  return {
    refunded: true,
    refundedAmountPaise: Number(result?.refundedAmount || 0),
    alreadyRefunded: false,
    refundId: result?.refundId || null,
  };
};

export const deductSellerWalletForReturn = async (order) => {
  const { default: Wallet } = await import('../wallet/wallet.model.js');
  const { default: WalletTransaction } = await import('../wallet/walletTransaction.model.js');

  const existingDebit = await WalletTransaction.findOne({ orderId: order._id, type: 'refund_debit' });
  if (existingDebit) {
    return {
      deducted: true,
      amount: Number(existingDebit.amount || 0),
      alreadyDeducted: true,
    };
  }

  const creditTx = await WalletTransaction.findOne({ orderId: order._id, type: 'credit' }).sort({ createdAt: -1 });
  if (!creditTx) {
    return { deducted: false, amount: 0, alreadyDeducted: false, reason: 'not_credited_yet' };
  }

  const deductionAmount = Number(order.sellerPayout || creditTx.amount || 0);
  if (deductionAmount <= 0) {
    return { deducted: false, amount: 0, alreadyDeducted: false, reason: 'invalid_amount' };
  }

  let wallet = await Wallet.findOne({ sellerId: order.sellerId });
  if (!wallet) {
    wallet = await Wallet.create({ sellerId: order.sellerId, balance: 0 });
  }

  const balanceBefore = Number(wallet.balance || 0);
  const balanceAfter = balanceBefore - deductionAmount;

  wallet.balance = balanceAfter;
  await wallet.save();

  await WalletTransaction.create({
    sellerId: order.sellerId,
    orderId: order._id,
    type: 'refund_debit',
    amount: deductionAmount,
    balanceBefore,
    balanceAfter,
    description: `Return refund deduction for order #${getPublicOrderId(order)}`,
  });

  return {
    deducted: true,
    amount: deductionAmount,
    alreadyDeducted: false,
    balanceAfter,
  };
};
