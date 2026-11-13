import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/salvar')({
  beforeLoad: () => { throw redirect({ to: '/', replace: true }); },
});
