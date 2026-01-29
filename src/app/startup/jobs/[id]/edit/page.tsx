import CreateEditJob from "../../_components/CreateEditJob";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreateEditJob jobId={id} />;
}
