import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BlogCard = ({ blog, user, onDelete }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-100 shadow-sm">
      <Card.Img variant="top" src={blog.cover} alt={blog.title} style={{ maxHeight: '400px', objectFit: 'cover' }} />
      <Card.Body>
        <div className="d-flex justify-content-between">
          <Badge bg="secondary">{blog.category}</Badge>
          <small className="text-muted">{blog.readTime.value} {blog.readTime.unit}</small>
        </div>
        <Card.Title>{blog.title}</Card.Title>
        <Card.Text>{blog.content.substring(0, 100)}...</Card.Text>
        <Card.Text>
          <small className="text-muted">
            Autore: {blog.author?.firstName} {blog.author?.lastName}
          </small>
        </Card.Text>
        <Button variant="primary" onClick={() => navigate(`/blogs/${blog._id}`)}>
          Leggi
        </Button>
        {user && user._id === blog.author?._id && (
          <div className="d-flex gap-2 mt-2">
            <Button variant="outline-primary" onClick={() => navigate(`/blogs/edit/${blog._id}`)}>
              Modifica
            </Button>
            <Button variant="outline-danger" onClick={() => onDelete && onDelete(blog._id)}>
              Elimina
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BlogCard;