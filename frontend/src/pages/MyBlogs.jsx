import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import BlogCard from '../components/BlogCard';

const MyBlogs = () => {
  const { user } = useAuth(); // Ottieni i dati dell'utente loggato
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBlogs = async () => {
      try {
        setLoading(true);
        console.log('User ID:', user._id); // Logga l'ID dell'utente loggato
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}blogs/my-blogs?author=${user._id}`);
        console.log('Response data:', response.data); // Logga la risposta del backend
        setBlogs(response.data.blogs);
      } catch (err) {
        console.error('Errore nella richiesta:', err); // Logga l'errore
        setError('Errore nel caricamento dei tuoi blog');
      } finally {
        setLoading(false);
      }
    };
  
    if (user) {
      fetchMyBlogs();
    }
  }, [user]);

  return (
    <Container className="mt-5">
      <h1>I Miei Blog</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        {loading ? (
          <p>Caricamento in corso...</p>
        ) : blogs.length > 0 ? (
          blogs.map((blog) => (
            <Col key={blog._id} md={4} className="mb-4">
              <BlogCard blog={blog} user={user} /> {/* Mostra i blog con il componente BlogCard */}
            </Col>
          ))
        ) : (
          <p>Non hai ancora pubblicato nessun blog</p>
        )}
      </Row>
    </Container>
  );
};

export default MyBlogs;