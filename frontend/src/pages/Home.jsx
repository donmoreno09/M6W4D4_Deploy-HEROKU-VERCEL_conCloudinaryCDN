import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Pagination } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import BlogCard from '../components/BlogCard';

const Home = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // Pagina corrente
  const [totalPages, setTotalPages] = useState(0); // Numero totale di pagine

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}blogs?page=${currentPage}&limit=6`);
        setBlogs(response.data.blogs);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError('Errore nel caricamento dei blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage]); // Ricarica i blog quando cambia la pagina corrente

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo blog?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_BASE_URL}blogs/${id}`);
        setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog._id !== id));
      } catch (err) {
        setError('Errore durante l\'eliminazione del blog');
      }
    }
  };

  return (
    <Container className="mt-5">
      <h1>Benvenuto nel Blog!</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        {loading ? (
          <p>Caricamento in corso...</p>
        ) : blogs.length > 0 ? (
          blogs.map((blog) => (
            <Col key={blog._id} md={4} className="mb-4">
              <BlogCard blog={blog} user={user} onDelete={handleDelete} />
            </Col>
          ))
        ) : (
          <p>Nessun blog disponibile</p>
        )}
      </Row>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            />
            {[...Array(totalPages)].map((_, idx) => (
              <Pagination.Item
                key={idx + 1}
                active={idx + 1 === currentPage}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            />
          </Pagination>
        </div>
      )}
    </Container>
  );
};

export default Home;