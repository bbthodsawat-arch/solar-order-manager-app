import React from 'react';
import { Transaction, ShopInfo, DocumentType } from '../types';
import DocumentGeneratorModal from './DocumentGeneratorModal';

interface ReceiptGeneratorProps {
  transaction: Transaction;
  shopInfo: ShopInfo;
  onClose: () => void;
  initialDocType?: DocumentType;
}

export default function ReceiptGenerator({ transaction, shopInfo, onClose, initialDocType = 'full_tax_invoice' }: ReceiptGeneratorProps) {
  return (
    <DocumentGeneratorModal
      isOpen={true}
      transaction={transaction}
      shopInfo={shopInfo}
      onClose={onClose}
      initialDocType={initialDocType}
    />
  );
}

