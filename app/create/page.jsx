import { Suspense } from 'react';
import { CreateForm } from './CreateForm';

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateForm />
    </Suspense>
  );
}
