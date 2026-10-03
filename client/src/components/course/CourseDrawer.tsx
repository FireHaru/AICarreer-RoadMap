import { useApi } from '../../lib/hooks';
import type { CourseDetail, RoadmapMutation } from '../../lib/types';
import { Drawer } from '../ui/Overlay';
import { ErrorState, Skeleton } from '../ui/primitives';
import { CourseDetailView } from './CourseDetailView';

/** Side panel with the full course detail; opened from roadmap nodes and lists. */
export function CourseDrawer({ code, onClose, onChanged }: { code: string | null; onClose: () => void; onChanged?: (m: RoadmapMutation) => void }) {
  const { data, error, loading, reload } = useApi<CourseDetail>(code ? `/catalog/courses/${code}` : null);
  const stale = data && data.course.code !== code;
  return (
    <Drawer open={Boolean(code)} onClose={onClose}>
      <div className="p-5 pt-6 sm:p-7">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data || stale || (loading && !data) ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <CourseDetailView
            detail={data}
            inDrawer
            onChanged={(m) => {
              onChanged?.(m);
              void reload();
            }}
          />
        )}
      </div>
    </Drawer>
  );
}
