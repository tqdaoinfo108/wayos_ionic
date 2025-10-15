import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonText,
} from '@ionic/react';

export interface DiscussionMessage {
  id?: string | number;
  author: string;
  timestamp: string;
  content: string;
}

interface DiscussionThreadProps {
  messages: DiscussionMessage[];
  sending?: boolean;
  onSend: (message: string) => Promise<void> | void;
  placeholder?: string;
}

const DiscussionThread: React.FC<DiscussionThreadProps> = ({
  messages,
  sending = false,
  onSend,
  placeholder = 'Nhập thảo luận...',
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Vui lòng nhập nội dung thảo luận.');
      return;
    }
    setError(null);
    await onSend(trimmed);
    setValue('');
  };

  return (
    <IonCard>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel position="stacked">Thảo luận</IonLabel>
          <IonTextarea
            value={value}
            onIonChange={(event) => setValue(event.detail.value ?? '')}
            autoGrow
            placeholder={placeholder}
            disabled={sending}
          />
        </IonItem>
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}
        <IonButton
          className="ion-margin-top"
          expand="block"
          onClick={handleSubmit}
          disabled={sending}
        >
          {sending ? 'Đang gửi…' : 'Gửi'}
        </IonButton>

        <IonList lines="none">
          {messages.map((message) => (
            <IonItem key={message.id ?? `${message.author}-${message.timestamp}-${message.content}`}>
              <IonLabel>
                <p>
                  <strong>{message.author}</strong>{' '}
                  <IonText color="medium">{message.timestamp}</IonText>
                </p>
                <p>{message.content}</p>
              </IonLabel>
            </IonItem>
          ))}
          {messages.length === 0 && (
            <IonItem>
              <IonLabel>
                <IonText color="medium">Chưa có thảo luận.</IonText>
              </IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};

export default DiscussionThread;
