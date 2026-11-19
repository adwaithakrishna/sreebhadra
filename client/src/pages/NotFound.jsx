import Button from '../components/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <section className="container-x py-32 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-lg mt-4">This road doesn’t lead anywhere.</h1>
      <p className="mx-auto mt-5 max-w-md text-lg">The page you’re looking for has moved or never existed.</p>
      <Button to="/" variant="dark" size="lg" className="mt-8">Back to home</Button>
    </section>
  );
}
