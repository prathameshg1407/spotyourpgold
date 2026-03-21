import Home from "./clientComponents/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PG in Indore for Students & Working People | Hostel, Rooms & Flats | SpotYourPG",
  description:
    "Find PG in Indore for students and working people. Get affordable PG with food, WiFi and safety. You can also check hostels, rooms and flats and choose the right place easily.",
};

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
