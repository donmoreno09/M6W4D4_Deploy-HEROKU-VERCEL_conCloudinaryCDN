import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/blogs');
      setBlogs(response.data);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei blog:', err);
      setError('Errore nel caricamento dei blog');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo blog?')) {
      try {
        await axios.delete(`http://localhost:3001/blogs/${id}`);
        fetchBlogs();
      } catch (err) {
        console.error('Errore durante l\'eliminazione:', err);
        setError('Errore durante l\'eliminazione del blog');
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/blogs/edit/${id}`);
  };

  if (loading) return <div>Caricamento...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <Container className="mt-4">
      <h2>Lista Blog</h2>
      <Row>
        {blogs.map(blog => (
          <Col key={blog._id} md={4} className="mb-4">
            <Card>
              <Card.Img variant="top" src={blog.cover} alt={blog.title} />
              <Card.Body>
                <Card.Title>{blog.title}</Card.Title>
                <Card.Text>{blog.content.substring(0, 100)}...</Card.Text>
                <Card.Text>
                  <small className="text-muted">
                    Autore: {blog.author?.name} {blog.author?.lastName}
                  </small>
                </Card.Text>
                <Card.Text>
                  <small className="text-muted">
                    Categoria: {blog.category}
                  </small>
                </Card.Text>
                <Card.Text>
                  <small className="text-muted">
                    Tempo di lettura: {blog.readTime?.value} {blog.readTime?.unit}
                  </small>
                </Card.Text>
                <ButtonGroup className="d-flex gap-2">
                  <Button variant="primary" onClick={() => handleEdit(blog._id)}>
                    Modifica
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(blog._id)}>
                    Elimina
                  </Button>
                </ButtonGroup>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Blogs; 