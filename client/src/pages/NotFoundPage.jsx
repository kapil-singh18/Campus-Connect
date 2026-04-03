import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl pt-14">
      <div className="card fade-in p-6 text-center">
        <h1 className="text-3xl font-extrabold">404</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">The page you are looking for does not exist.</p>
        <Link to="/dashboard" className="btn-primary mt-5 inline-block">
          Go to Dashboard
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
