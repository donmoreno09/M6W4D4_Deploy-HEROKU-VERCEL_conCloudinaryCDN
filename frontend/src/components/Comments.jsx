import { useState, useEffect, useCallback } from 'react';
import { Form, Button, ListGroup, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Comments = ({ blogId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Utilizziamo useCallback per memorizzare la funzione fetchComments
  //useCallback è un hook che memorizza una funzione e la restituisce quando necessario
  //Questo è utile per evitare che la funzione venga ricreata ad ogni renderizzazione, causando un loop infinito
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}blogs/${blogId}/comments`);
      setComments(response.data);
      setError('');
    } catch (err) {
      console.error('Errore nel caricamento dei commenti:', err);
      setError('Impossibile caricare i commenti');
    } finally {
      setLoading(false);
    }
  }, [blogId]); // Dipendenza: blogId

  useEffect(() => {
    if (blogId) {
      fetchComments();
    }
  }, [blogId, fetchComments]); // Includiamo fetchComments nelle dipendenze

  // Aggiungi un nuovo commento
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Devi essere loggato per commentare');
      return;
    }

    if (!newComment.trim()) {
      setError('Il commento non può essere vuoto');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}blogs/${blogId}/comments`, {
        content: newComment,
        author: user._id
      });
      setNewComment('');
      setError('');
      fetchComments(); // Ricarica i commenti
    } catch (err) {
      console.error('Errore nell\'aggiunta del commento:', err);
      setError('Impossibile aggiungere il commento');
    }
  };

  // Modifica un commento
  const handleEditComment = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      setError('Il commento non può essere vuoto');
      return;
    }

    try {
      await axios.put(`http://localhost:3001/blogs/${blogId}/comments/${editingComment._id}`, {
        content: editContent
      });
      setEditingComment(null);
      setEditContent('');
      setError('');
      fetchComments(); // Ricarica i commenti
    } catch (err) {
      console.error('Errore nella modifica del commento:', err);
      setError('Impossibile modificare il commento');
    }
  };

  // Elimina un commento
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo commento?')) {
      try {
        await axios.delete(`http://localhost:3001/blogs/${blogId}/comments/${commentId}`);
        fetchComments(); // Ricarica i commenti
      } catch (err) {
        console.error('Errore nell\'eliminazione del commento:', err);
        setError('Impossibile eliminare il commento');
      }
    }
  };

  return (
    <div className="mt-5">
      <h3>Commenti</h3>
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Form per aggiungere un nuovo commento */}
      {user && (
        <Form onSubmit={handleAddComment} className="mb-4">
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Scrivi un commento..."
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="mt-2">
            Commenta
          </Button>
        </Form>
      )}

      {/* Form per modificare un commento */}
      {editingComment && (
        <Form onSubmit={handleEditComment} className="mb-4">
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
            />
          </Form.Group>
          <div className="d-flex gap-2 mt-2">
            <Button type="submit" variant="success">
              Salva
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingComment(null);
                setEditContent('');
              }}
            >
              Annulla
            </Button>
          </div>
        </Form>
      )}

      {/* Lista dei commenti */}
      {loading ? (
        <p>Caricamento commenti...</p>
      ) : comments.length > 0 ? (
        <ListGroup>
          {comments.map((comment) => (
            <ListGroup.Item key={comment._id} className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>
                    {comment.author.firstName} {comment.author.lastName}
                  </strong>
                  <small className="ms-2 text-muted">
                    {new Date(comment.createdAt).toLocaleString()}
                  </small>
                </div>
                {user && user._id === comment.author._id && !editingComment && (
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setEditingComment(comment);
                        setEditContent(comment.content);
                      }}
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      Elimina
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-2 mb-0">{comment.content}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>Nessun commento presente. Sii il primo a commentare!</p>
      )}
    </div>
  );
};

export default Comments;