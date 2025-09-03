import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Share2, 
  Instagram, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Send,
  Copy,
  QrCode
} from 'lucide-react-native';
import { Post, PetProfile } from '@/types/index';
import shareService from '@/services/shareService';

const { width } = Dimensions.get('window');

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  pet: PetProfile;
}

export default function ShareModal({ visible, onClose, post, pet }: ShareModalProps) {
  const handleShare = async (platform: string) => {
    try {
      switch (platform) {
        case 'native':
          await shareService.sharePost(post, pet);
          break;
        case 'instagram':
          await shareService.shareToInstagram(post, pet);
          break;
        case 'twitter':
          await shareService.shareToTwitter(post, pet);
          break;
        case 'facebook':
          await shareService.shareToFacebook(post, pet);
          break;
        case 'whatsapp':
          await shareService.shareToWhatsApp(post, pet);
          break;
        case 'telegram':
          await shareService.shareToTelegram(post, pet);
          break;
        case 'copy':
          await shareService.copyPostLink(post.id);
          break;
        case 'qr':
          const qrUrl = await shareService.generateQRCode(post.id);
          // QR kod modal'ı açılabilir
          break;
      }
      
      // Paylaşım takibi
      await shareService.trackShare(post.id, platform);
      onClose();
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const shareOptions = [
    {
      id: 'native',
      title: 'Diğer Uygulamalar',
      icon: Share2,
      color: '#667eea',
      description: 'Sistem paylaşım menüsü'
    },
    {
      id: 'instagram',
      title: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      description: 'Instagram Stories\'e paylaş'
    },
    {
      id: 'twitter',
      title: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      description: 'Tweet olarak paylaş'
    },
    {
      id: 'facebook',
      title: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      description: 'Facebook\'ta paylaş'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      description: 'WhatsApp\'a gönder'
    },
    {
      id: 'telegram',
      title: 'Telegram',
      icon: Send,
      color: '#0088CC',
      description: 'Telegram\'a gönder'
    },
    {
      id: 'copy',
      title: 'Linki Kopyala',
      icon: Copy,
      color: '#6B7280',
      description: 'Post linkini kopyala'
    },
    {
      id: 'qr',
      title: 'QR Kod',
      icon: QrCode,
      color: '#10B981',
      description: 'QR kod oluştur'
    }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Paylaş</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#FFFFFF" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            {/* Post Preview */}
            <View style={styles.postPreview}>
              <Image source={{ uri: post.mediaUrl }} style={styles.previewImage} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{pet.name}</Text>
                <Text style={styles.previewCaption} numberOfLines={2}>
                  {post.caption}
                </Text>
              </View>
            </View>

            {/* Share Options */}
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Paylaşım Seçenekleri</Text>
              <View style={styles.optionsGrid}>
                {shareOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionItem}
                      onPress={() => handleShare(option.id)}
                    >
                      <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                        <IconComponent color="#FFFFFF" size={24} strokeWidth={2} />
                      </View>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  postPreview: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  previewCaption: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  optionsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionItem: {
    width: (width - 60) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
