// app/service/[service_id]/page.tsx
import { notFound } from "next/navigation";
import Header from "../../../components/header";
import ServiceDataButtons from "../../../components/ServiceDataButtons";

interface PageProps {
  params: {
    service_id: string;
  };
}

async function getServiceData(service_id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/fastly`);
    const data = await response.json();

    const service = data.services.find((s: any) => s.id === service_id);
    if (!service) return null;

    const environment = service.environments?.find((env: any) => env.name === "production");

    return {
      name: service.name,
      id: service.id,
      active_version: environment?.active_version ?? "N/A",
    };
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

export default async function ServiceDetails({ params }: PageProps) {
  const service = await getServiceData(params.service_id);

  if (!service) return notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Header />
      <div className="flex items-center gap-4 text-gray-700 mb-6">
        <h1 className="text-xl text-black font-bold">{service.name}</h1>
        <span>|</span>
        <div><strong>ID:</strong> {service.id}</div>
        <span>|</span>
        <div><strong>Version:</strong> {service.active_version}</div>
      </div>
      <ServiceDataButtons service={service} className="mt-4" />
    </div>
  );
}
