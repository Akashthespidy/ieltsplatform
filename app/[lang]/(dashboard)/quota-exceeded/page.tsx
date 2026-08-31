import { getDictionary, Locale } from "@/lib/i18n";
import { QuotaExceededClient } from "@/components/quota-exceeded-client";

export default async function QuotaExceededPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return <QuotaExceededClient lang={lang} />;
}
