import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { CourseDetailView } from '../components/course/CourseDetailView';
import { ErrorState, PageLoader } from '../components/ui/primitives';
import { useI18n } from '../i18n';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { CourseDetail } from '../lib/types';

export default function CourseDetailPage() {
  const { t } = useI18n();
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi<CourseDetail>(`/catalog/courses/${encodeURIComponent(code)}`);
  useDocumentTitle(data?.course.title ?? t('Course'));

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/courses'))} className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" /> {t('Back')}
      </button>
      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <div className="card p-5 sm:p-8">
          <CourseDetailView detail={data} onChanged={() => void reload()} />
        </div>
      ) : null}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/courses" className="text-cyan-300 hover:underline">{t('Browse the full course library')}</Link>
      </p>
    </div>
  );
}
