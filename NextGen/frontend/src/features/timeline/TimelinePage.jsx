import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import { fetchTimeline } from './timelineApi'
import TimelineComposer from './TimelineComposer'
import TimelinePostCard from './TimelinePostCard'
import MyTimelinePanel from './MyTimelinePanel'
import { Alert } from '../../components/ui'

const TimelinePage = () => {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['timeline', 'feed'],
    queryFn: ({ pageParam = 1 }) => fetchTimeline({ page: pageParam, limit: 6 }),
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      return lastPage.has_more ? lastPage.next_page : undefined
    },
    staleTime: 60 * 1000,
  })

  const posts = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.posts || [])
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Phase 9</p>
        <h1 className="text-3xl font-bold text-gray-900">Chronicle Timeline</h1>
        <p className="text-gray-600">
          Share updates, celebrate milestones, and stay in sync with the Chronicle community.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <TimelineComposer />

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{isFetching ? 'Updating feed...' : `Showing ${posts.length} posts`}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 hover:border-primary-500 hover:text-primary-600"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-gray-500">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary-500" />
              Loading timeline posts...
            </div>
          ) : error ? (
            <Alert variant="error">
              Failed to load timeline. Please refresh the page.
            </Alert>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No posts yet. Be the first to share an update!
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <TimelinePostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-6 py-2 text-sm font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-60"
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more posts'
                )}
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <MyTimelinePanel />
        </aside>
      </div>
    </div>
  )
}

export default TimelinePage
