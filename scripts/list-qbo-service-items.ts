/**
 * List QuickBooks items (Id + Name + Type) for Amplify env setup.
 *
 * Usage:
 *   npx tsx scripts/list-qbo-service-items.ts
 *   npx tsx scripts/list-qbo-service-items.ts --all
 */
import { getValidQuickBooksTokens } from "@/lib/integrations/quickbooks/oauth";
import { quickBooksGet } from "@/lib/integrations/quickbooks/client";

type ItemRow = {
  Id: string;
  Name: string;
  Type?: string;
  Active?: boolean;
};

type QueryResponse = {
  QueryResponse?: {
    Item?: ItemRow[];
  };
};

const listAll = process.argv.includes("--all");

const main = async (): Promise<void> => {
  await getValidQuickBooksTokens();
  const query = encodeURIComponent(
    listAll
      ? "select Id, Name, Type, Active from Item maxresults 1000"
      : "select Id, Name, Type, Active from Item where Type = 'Service' maxresults 1000"
  );
  const response = await quickBooksGet<QueryResponse>(`/query?query=${query}`);
  const items = (response.QueryResponse?.Item ?? [])
    .filter((item) => item.Active !== false)
    .sort((a, b) => a.Name.localeCompare(b.Name));

  if (items.length === 0) {
    console.log("No active items found.");
    return;
  }

  for (const item of items) {
    console.log(`${item.Id}\t${item.Type ?? "?"}\t${item.Name}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
