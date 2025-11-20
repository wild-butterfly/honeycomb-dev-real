import { useParams } from "react-router-dom";

export default function JobPage() {
  const { jobId } = useParams();

  return (
    <div style={{ padding: 40 }}>
      <h1>Job Details</h1>
      <p>Job ID: {jobId}</p>

      <p>Buraya müşteri iletişim bilgileri, site contact, notes,
      test results gibi bölümler eklenecek.</p>
    </div>
  );
}
