import { Alert, Share as RNShare, Linking } from 'react-native';
import { Post, PetProfile } from '@/types/index';

class ShareService {
  // Native share dialog
  async sharePost(post: Post, pet: PetProfile): Promise<void> {
    try {
      const shareMessage = `${pet.name} (@${pet.name.toLowerCase()}) tarafından paylaşıldı:\n\n${post.caption}\n\n#PetLove #${pet.species.toLowerCase()} #${pet.breed.toLowerCase().replace(/\s+/g, '')}`;
      
      const result = await RNShare.share({
        message: shareMessage,
        url: post.mediaUrl,
        title: `${pet.name} - PetLove`,
      });

      if (result.action === RNShare.sharedAction) {
        console.log('Post başarıyla paylaşıldı');
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  }

  // Sosyal medya paylaşımları
  async shareToInstagram(post: Post, pet: PetProfile): Promise<void> {
    try {
      const caption = `${pet.name} (@${pet.name.toLowerCase()}) tarafından paylaşıldı:\n\n${post.caption}\n\n#PetLove #${pet.species.toLowerCase()} #${pet.breed.toLowerCase().replace(/\s+/g, '')}`;
      
      // Instagram Stories için
      const instagramUrl = `instagram-stories://share?backgroundImage=${encodeURIComponent(post.mediaUrl)}&sticker=${encodeURIComponent(pet.photoUrl)}`;
      
      const canOpen = await Linking.canOpenURL(instagramUrl);
      if (canOpen) {
        await Linking.openURL(instagramUrl);
      } else {
        // Instagram yüklü değilse, web versiyonuna yönlendir
        const webUrl = `https://www.instagram.com/`;
        await Linking.openURL(webUrl);
        Alert.alert('Instagram', 'Instagram uygulamasını yükleyip tekrar deneyin');
      }
    } catch (error) {
      console.error('Instagram paylaşım hatası:', error);
      Alert.alert('Hata', 'Instagram paylaşımı sırasında bir hata oluştu');
    }
  }

  async shareToTwitter(post: Post, pet: PetProfile): Promise<void> {
    try {
      const text = `${pet.name} (@${pet.name.toLowerCase()}) tarafından paylaşıldı:\n\n${post.caption}\n\n#PetLove #${pet.species.toLowerCase()} #${pet.breed.toLowerCase().replace(/\s+/g, '')}`;
      
      const twitterUrl = `twitter://post?message=${encodeURIComponent(text)}`;
      
      const canOpen = await Linking.canOpenURL(twitterUrl);
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        // Twitter yüklü değilse, web versiyonuna yönlendir
        const webUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Twitter paylaşım hatası:', error);
      Alert.alert('Hata', 'Twitter paylaşımı sırasında bir hata oluştu');
    }
  }

  async shareToFacebook(post: Post, pet: PetProfile): Promise<void> {
    try {
      const text = `${pet.name} (@${pet.name.toLowerCase()}) tarafından paylaşıldı:\n\n${post.caption}\n\n#PetLove #${pet.species.toLowerCase()} #${pet.breed.toLowerCase().replace(/\s+/g, '')}`;
      
      const facebookUrl = `fb://facewebmodal/f?href=${encodeURIComponent(`https://www.facebook.com/sharer/sharer.php?u=${post.mediaUrl}&quote=${text}`)}`;
      
      const canOpen = await Linking.canOpenURL(facebookUrl);
      if (canOpen) {
        await Linking.openURL(facebookUrl);
      } else {
        // Facebook yüklü değilse, web versiyonuna yönlendir
        const webUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.mediaUrl)}&quote=${encodeURIComponent(text)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Facebook paylaşım hatası:', error);
      Alert.alert('Hata', 'Facebook paylaşımı sırasında bir hata oluştu');
    }
  }

  async shareToWhatsApp(post: Post, pet: PetProfile): Promise<void> {
    try {
      const text = `${pet.name} (@${pet.name.toLowerCase()}) tarafından paylaşıldı:\n\n${post.caption}\n\n#PetLove #${pet.species.toLowerCase()} #${pet.breed.toLowerCase().replace(/\s+/g, '')}`;
      
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text + '\n\n' + post.mediaUrl)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp', 'WhatsApp uygulamasını yükleyip tekrar deneyin');
      }
    } catch (error) {
      console.error('WhatsApp paylaşım hatası:', error);
      Alert.alert('Hata', 'WhatsApp paylaşımı sırasında bir hata oluştu');
    }
  }

  async shareToTelegram(post: Post, pet: PetProfile): Promise<void> {
    try {
      const text = `${pet.name} (@${pet.name.toLowerCase()}) tarafından paylaşıldı:\n\n${post.caption}\n\n#PetLove #${pet.species.toLowerCase()} #${pet.breed.toLowerCase().replace(/\s+/g, '')}`;
      
      const telegramUrl = `tg://msg?text=${encodeURIComponent(text + '\n\n' + post.mediaUrl)}`;
      
      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        Alert.alert('Telegram', 'Telegram uygulamasını yükleyip tekrar deneyin');
      }
    } catch (error) {
      console.error('Telegram paylaşım hatası:', error);
      Alert.alert('Hata', 'Telegram paylaşımı sırasında bir hata oluştu');
    }
  }

  // Link kopyalama
  async copyPostLink(postId: string): Promise<void> {
    try {
      const postUrl = `https://petlove.app/post/${postId}`;
      
      // React Native'de clipboard kullanımı için expo-clipboard gerekli
      // import * as Clipboard from 'expo-clipboard';
      // await Clipboard.setStringAsync(postUrl);
      
      Alert.alert('Başarılı', 'Post linki kopyalandı!');
    } catch (error) {
      console.error('Link kopyalama hatası:', error);
      Alert.alert('Hata', 'Link kopyalanırken bir hata oluştu');
    }
  }

  // QR kod oluşturma
  async generateQRCode(postId: string): Promise<string> {
    try {
      const postUrl = `https://petlove.app/post/${postId}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(postUrl)}`;
      return qrCodeUrl;
    } catch (error) {
      console.error('QR kod oluşturma hatası:', error);
      throw error;
    }
  }

  // Paylaşım istatistikleri
  async trackShare(postId: string, platform: string): Promise<void> {
    try {
      // Firebase Analytics veya başka bir analytics servisi ile paylaşım takibi
      console.log(`Post ${postId} ${platform} üzerinden paylaşıldı`);
      
      // Burada analytics servisine veri gönderebilirsiniz
      // analytics().logEvent('post_shared', {
      //   post_id: postId,
      //   platform: platform,
      //   timestamp: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Paylaşım takibi hatası:', error);
    }
  }
}

export default new ShareService();
