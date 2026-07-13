import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCriteria, createScreening } from "../services/screeningService";
import { toast } from "sonner";
import { ClipboardCheck, ArrowLeft } from "lucide-react";

export default function ScreeningPage() {
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState([]);
  const [checked, setChecked] = useState({}); // { no_kriteria: true }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    getCriteria()
      .then((res) => setCriteria(res.data.data))
      .catch(() => toast.error("Gagal memuat kriteria penapisan."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (no) => setChecked((p) => ({ ...p, [no]: !p[no] }));

  const jumlahDicentang = Object.values(checked).filter(Boolean).length;

  const submit = async () => {
    const dipilih = Object.keys(checked)
      .filter((no) => checked[no])
      .map(Number);

    setSubmitting(true);
    try {
      const res = await createScreening(dipilih);
      setHasil(res.data);
      toast.success("Penapisan tersimpan.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan penapisan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Memuat kriteria...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/screening")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="text-emerald-600" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Penapisan Jenis Pekerjaan</h1>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Centang kriteria yang sesuai dengan pekerjaan. Jika minimal satu tercentang, pekerjaan wajib mengajukan izin kerja.
          </p>

          {hasil ? (
            <div className={`rounded-lg p-4 mb-4 ${hasil.data.butuh_izin ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              <p className="font-semibold">{hasil.message}</p>
              {hasil.data.butuh_izin && (
                <button
                  onClick={() => navigate(`/permits/new?screening=${hasil.data.id}`)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                >
                  Lanjut ke Pengajuan Izin
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[55vh] overflow-auto mb-4">
                {criteria.map((c) => (
                  <label key={c.no_kriteria} className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={!!checked[c.no_kriteria]} onChange={() => toggle(c.no_kriteria)} className="mt-1 accent-emerald-600" />
                    <span className="text-sm text-slate-700">
                      <span className="font-medium text-slate-400 mr-1">{c.no_kriteria}.</span>
                      {c.deskripsi}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{jumlahDicentang} kriteria dicentang</span>
                <button onClick={submit} disabled={submitting} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {submitting ? "Menyimpan..." : "Simpan Penapisan"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
