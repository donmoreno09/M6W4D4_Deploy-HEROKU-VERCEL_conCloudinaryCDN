import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Comments from '../components/Comments';

const BlogDetail = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3001/blogs/${id}`);
        setBlog(response.data);
        setError(null);
      } catch (err) {
        console.error('Errore nel caricamento del blog:', err);
        setError('Errore nel caricamento del blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questo blog?')) {
      try {
        await axios.delete(`http://localhost:3001/blogs/${id}`);
        navigate('/my-blogs');
      } catch (err) {
        setError('Errore durante l\'eliminazione del blog');
      }
    }
  };

  if (loading) return <Container className="mt-5"><p>Caricamento in corso...</p></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!blog) return <Container className="mt-5"><Alert variant="warning">Blog non trovato</Alert></Container>;

  const isAuthor = user && blog.author && user._id === blog.author._id; // Verifica se l'utente è l'autore del blog 

  return (
    <Container className="mt-5">
      <Row>
        <Col md={8}>
          <h1>{blog.title}</h1>
          <div className="d-flex justify-content-between mb-3">
            <span className="badge bg-secondary">{blog.category}</span>
            <span>{blog.readTime.value} {blog.readTime.unit} di lettura</span>
          </div>
          
          {isAuthor && (
            <div className="mb-4">
              <Button variant="outline-primary" className="me-2" onClick={() => navigate(`/edit-blog/${blog._id}`)}>
                Modifica
              </Button>
              <Button variant="outline-danger" onClick={handleDelete}>
                Elimina
              </Button>
            </div>
          )}
          
          <div className="blog-content mb-5">
            {blog.content}
          </div>
          
          <div className="author-info mb-5">
            <p>
              <strong>Autore:</strong> {blog.author?.firstName} {blog.author?.lastName}
            </p>
            <p>
              <small className="text-muted">
                Pubblicato il {new Date(blog.createdAt).toLocaleDateString()}
              </small>
            </p>
          </div>
          
          {/* Sezione Commenti */}
          <Comments blogId={blog._id} />
        </Col>
        
        <Col md={4}>
          <div className="position-sticky" style={{ top: '2rem' }}>
            <img
              src={blog.cover}
              alt={blog.title}
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: '400px', objectFit: 'cover' }}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default BlogDetail;