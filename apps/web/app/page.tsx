import DynamicPage from "./[...slug]/page";

export default async function RootPage() {
  return <DynamicPage params={Promise.resolve({ slug: [] })} />;
}

