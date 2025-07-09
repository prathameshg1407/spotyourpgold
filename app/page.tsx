"use server";

import Home from "./clientComponents/Home";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;

  const pageParam = resolvedSearchParams.page ?? "1";
  const perPageParam = resolvedSearchParams.per_page ?? "20";

  const page = Math.max(1, Number(pageParam));
  const per_page = Math.min(50, Number(perPageParam));

  return (
    <main className="w-full pb-36 overflow-x-hidden">
      <Home page={page} per_page={per_page} />
    </main>
  );
};

export default Page;
