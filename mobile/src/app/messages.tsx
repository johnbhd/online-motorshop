import { CustomerEmptyState, CustomerScreen } from '@/components/customer-screen';

export default function MessagesScreen() {
  return (
    <CustomerScreen>
      <CustomerEmptyState
        description="Your conversations with ALD Motorshop will appear here."
        icon="..."
        title="No conversations yet."
      />
    </CustomerScreen>
  );
}
