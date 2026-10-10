import {
  CustomerEmptyState,
  CustomerScreen,
} from '@/components/customer-screen';

export default function OrdersScreen() {
  return (
    <CustomerScreen>
      <CustomerEmptyState
        description="Your submitted order requests will appear here."
        icon="O"
        title="No order requests yet."
      />
    </CustomerScreen>
  );
}
