// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import CourseCard from '../components/CourseCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-toastify'
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'

const Home = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states (category removed)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCourses()
  }, [page, search, level, minPrice, maxPrice, sort])

  const fetchCourses = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = '/api-v1/dashboard/search-filter?'
      const params = new URLSearchParams()

      if (search.trim()) params.append('q', search.trim())
      if (level && level !== 'all') params.append('level', level)
      if (minPrice && !isNaN(Number(minPrice))) params.append('minPrice', minPrice)
      if (maxPrice && !isNaN(Number(maxPrice))) params.append('maxPrice', maxPrice)
      params.append('sort', sort)
      params.append('page', page)
      params.append('limit', 12)

      url += params.toString()

      const res = await api.get(url)
      const data = res.data

      if (data.success) {
        setCourses(data.courses || [])
        setTotalPages(data.totalPages || 1)
      } else {
        throw new Error(data.message || 'No courses found')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load courses'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchCourses()
  }

  const handleClearFilters = () => {
    setSearch('')
    setLevel('all')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setPage(1)
    fetchCourses()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Learn Anything, Anywhere
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            High-quality video courses taught by expert instructors — start your learning journey today
          </p>

          {/* Prominent My Enrolled Courses Button */}
          <div className="mb-12">
            <Button asChild size="lg" className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all">
              <Link to="/student-dashboard">
                <BookOpen className="mr-3 h-6 w-6" />
                My Enrolled Courses
              </Link>
            </Button>
          </div>

          {/* Search & Filters (no category) */}
          <form onSubmit={handleSearch} className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search courses by title, description or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-12 text-lg"
              />
              <Button type="submit" size="lg" className="h-12 px-8">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>

            {/* Advanced Filters Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Level */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Level</label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Level</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Price */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Any"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Sort By</label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                  <Button type="submit">
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      {/* Courses Section */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-destructive mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => fetchCourses()}>Try Again</Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">No courses found</h2>
            <p className="text-muted-foreground mb-6">
              {search.trim() || level !== 'all' || minPrice || maxPrice
                ? "Try different filters or search terms"
                : "Check back later for new courses"}
            </p>
            {(search.trim() || level !== 'all' || minPrice || maxPrice) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              {search.trim() ? `Search Results for "${search}"` : 'Featured Courses'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <span className="text-sm font-medium px-4">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home