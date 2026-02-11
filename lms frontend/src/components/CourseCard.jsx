import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

const CourseCard = ({ course }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
      <div className="aspect-video relative">
        <img
          src={course.Thumbnail || 'https://via.placeholder.com/640x360?text=Course+Thumbnail'}
          alt={course.Title}
          className="object-cover w-full h-full"
        />
        {course.Price === 0 && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            Free
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="line-clamp-2">{course.Title || 'Untitled Course'}</CardTitle>
        <CardDescription className="line-clamp-1">
          {course.Teacher?.Name || 'Unknown Instructor'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{course.Rating?.toFixed(1) || 0} ({course.numReviews || 0})</span>
          </div>
          <span>
            {course.totalLectures || 0} lectures • {formatDuration(course.totalDuration)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <span className="font-semibold text-lg">
          {course.Price === 0 ? 'Free' : `₹${course.Price}`}
        </span>
        <Link to={`/courses/${course._id}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;