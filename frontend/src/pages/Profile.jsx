import { useState, useRef } from 'react';
import { Container, Form, Button, Alert, Image, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    currentPassword: '',
    newPassword: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null); // useRef è un hook che restituisce un oggetto ref; Questo oggetto ref può essere utilizzato per accedere all'elemento DOM

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Preparare i dati del form con FormData per gestire i file
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      
      // Aggiungi password solo se sono state inserite
      if (formData.currentPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
      }
      if (formData.newPassword) {
        formDataToSend.append('newPassword', formData.newPassword);
      }
      
      // Aggiungi il file dell'avatar se è stato selezionato
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }
      
      const response = await axios.put(
        `http://localhost:3001/users/${user._id}`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Aggiorna i dati dell'utente nel contesto di autenticazione
      login(response.data);
      
      setSuccess('Profilo aggiornato con successo');
      setError('');
      
      // Resetta i campi password
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante l\'aggiornamento del profilo');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Verifica che il file sia un'immagine
      if (!selectedFile.type.match('image.*')) {
        setError('Seleziona un file immagine valido (JPEG, PNG).');
        return;
      }
      
      // Verifica la dimensione del file (max 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('L\'immagine non deve superare i 2MB.');
        return;
      }
      
      setAvatar(selectedFile);
      
      // Crea un'anteprima dell'immagine
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);

      // reader è un oggetto che legge il file selezionato e restituisce un URL che può essere utilizzato come src per un'immagine
      // quidni FileReader() è un metodo che legge il contenuto di un file e restituisce il contenuto in un formato che può essere utilizzato per l'elaborazione successiva
      // onloadend è un evento che si verifica quando il file è stato completamente caricato
      // reader.result restituisce l'URL del file caricato
      // setPreviewUrl imposta l'URL dell'immagine come URL del file caricato
      // reader.readAsDataURL(selectedFile) legge il contenuto del file come URL


      setError(''); // Reset dell'errore se tutto è andato a buon fine
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  }; //Questo metodo viene chiamato quando si fa clic sull'icona di modifica dell'avatar
  //Fa si che il file input venga cliccato quando si fa clic sull'icona di modifica dell'avatar

  // Funzione per mostrare l'avatar dell'utente o un placeholder
  const getProfileImage = () => {
    if (previewUrl) {
      return previewUrl;
    } else if (user?.avatar) {
      return user.avatar;
    } else {
      return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${user?.firstName}+${user?.lastName}`;
    }
  };

  return (
    <Container className="mt-5">
      <h2>Profilo</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Row className="mb-4">
        <Col xs={12} md={4} className="text-center mb-3">
          <div className="position-relative d-inline-block">
            <Image
              src={getProfileImage()}
              alt="Profile"
              roundedCircle
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              className="border"
            />
            <div 
              className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2"
              style={{ cursor: 'pointer' }}
              onClick={triggerFileInput}
            >
              <i className="bi bi-pencil-fill text-white"></i>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
          <div className="mt-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={triggerFileInput}
              className="mt-2"
            >
              Cambia foto profilo
            </Button>
          </div>
        </Col>
        
        <Col xs={12} md={8}>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cognome</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <hr />
            <h5>Modifica Password</h5>
            <Form.Group className="mb-3">
              <Form.Label>Password Attuale</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nuova Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Lascia vuoto per mantenere la password attuale.
              </Form.Text>
            </Form.Group>
            <Button type="submit" disabled={loading}>
              {loading ? 'Aggiornamento in corso...' : 'Aggiorna Profilo'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;