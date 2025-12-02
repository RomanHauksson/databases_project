import { BorrowerForm } from "./borrower-form";
import { BorrowerFines } from "./borrower-fines";

export default function Borrower() {
  return (
    <div className="space-y-8">
      <h1 className="font-bold text-xl mb-4">Borrower Management</h1>
      <div className="space-y-6">
        <section>
          <h2 className="font-semibold text-lg mb-4">Create New Borrower</h2>
          <BorrowerForm />
        </section>
        <section>
          <h2 className="font-semibold text-lg mb-4">View and Pay Fines</h2>
          <BorrowerFines />
        </section>
      </div>
    </div>
  );
}

