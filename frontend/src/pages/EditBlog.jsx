import { useState, useEffect, useCallback } from 'react';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const EditBlog = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    readTime: {
      value: 0,
      unit: 'minuti'
    },
    cover: null,
    author: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchBlog = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}blogs/${id}`);
      const blog = response.data;
      
      // Verifica se l'utente è l'autore del blog
      if (user && blog.author && user._id !== blog.author._id) {
        setError("Non sei autorizzato a modificare questo blog");
        setTimeout(() => navigate('/my-blogs'), 2000); // Reindirizza dopo 2 secondi
        return;
      }
      
      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        category: blog.category || '',
        readTime: blog.readTime || { value: 1, unit: 'minuti' },
        cover: null,
        author: blog.author?._id || user?._id || ''
      });
    } catch (err) {
      console.error('Errore nel caricamento del blog:', err);
      setError(`Errore nel caricamento del blog: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchBlog();
    } else {
      setError("Devi essere loggato per modificare un blog");
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [fetchBlog, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('readTime', JSON.stringify(formData.readTime));
      
      if (formData.author) {
        formDataToSend.append('author', formData.author);
      }
      
      if (formData.cover) {
        formDataToSend.append('cover', formData.cover);
      }

      await axios.put(`${process.env.REACT_APP_API_BASE_URL}blogs/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setError('');
      navigate(`/blogs/${id}`);
    } catch (err) {
      console.error('Errore durante l\'aggiornamento:', err);
      setError(err.response?.data?.message || 'Errore durante l\'aggiornamento del blog');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'cover') {
      setFormData({ ...formData, cover: e.target.files[0] });
    } else if (e.target.name.startsWith('readTime.')) {
      const field = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        readTime: { 
          ...formData.readTime, 
          [field]: field === 'value' ? parseInt(e.target.value) : e.target.value 
        }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Correzione degli operatori logici con parentesi per chiarire l'ordine di esecuzione
  if ((error && error.includes("Non sei autorizzato")) || (error && error.includes("Devi essere loggato"))) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <p>Sarai reindirizzato a breve...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Modifica Blog</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
          <p className="mt-2">Caricamento in corso...</p>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Titolo</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Contenuto</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Categoria</Form.Label>
            <Form.Control
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Tempo di Lettura</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="number"
                name="readTime.value"
                value={formData.readTime.value}
                onChange={handleChange}
                required
                min="1"
              />
              <Form.Select
                name="readTime.unit"
                value={formData.readTime.unit}
                onChange={handleChange}
                required
              >
                <option value="minuti">Minuti</option>
                <option value="ore">Ore</option>
              </Form.Select>
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Immagine di Copertina</Form.Label>
            <Form.Control
              type="file"
              name="cover"
              onChange={handleChange}
              accept="image/*"
            />
            <Form.Text className="text-muted">
              Lascia vuoto per mantenere l'immagine corrente
            </Form.Text>
          </Form.Group>
          
          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Aggiornamento...' : 'Aggiorna Blog'}
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/blogs/${id}`)}>
              Annulla
            </Button>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default EditBlog;