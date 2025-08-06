import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MessageCircle, Clock, Search, Grid, List, Moon, Sun } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import AuthPrompt from '@/components/AuthPrompt';

interface Message {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  avatar: string;
}

const mockMessages = {
  en: [
    {
      id: '1',
      name: 'John Smith',
      message: 'Is this item still available?',
      time: '2 sec ago',
      unread: true,
      avatar: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=100'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      message: 'Can we meet tomorrow?',
      time: '1 hr ago',
      unread: false,
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100'
    }
  ],
  ny: [
    {
      id: '1',
      name: 'Chifundo Banda',
      message: 'Kodi chinthuchi chili ndipo?',
      time: 'Masekondi 2',
      unread: true,
      avatar: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=100'
    },
    {
      id: '2',
      name: 'Tiyamike Phiri',
      message: 'Mungakumane mawa?',
      time: 'Ola 1',
      unread: false,
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100'
    }
  ]
};

export default function MessagesScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const { theme, themeKey, toggleTheme, toggleLanguage, t, language } = useAppContext();
  const { user } = useAuth();
  const messages = mockMessages[language];
  const styles = createStyles(theme);

  // Show auth prompt if user is not logged in
  if (!user) {
    return (
      <AuthPrompt
        title={language === 'en' ? "Connect with Buyers" : "Lumikizanani ndi Ogula"}
        description={language === 'en' ? "Sign in to start chatting with buyers and sellers in the marketplace." : "Lowani kuti muyambe kulankhula ndi ogula ndi ogulitsa m'msika."}
        icon="login"
      />
    );
  }

  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    msg.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: theme.border }]}>
            {themeKey === 'light' ? 
              <Moon size={16} color={theme.textSecondary} /> : 
              <Sun size={16} color={theme.textSecondary} />
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLanguage} style={[styles.languageButton, { backgroundColor: theme.border }]}>
            <Text style={[styles.languageText, { color: theme.text }]}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 140}}>
          {filteredMessages.map((message) => (
            <TouchableOpacity key={message.id} style={styles.messageItem}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: message.avatar }} style={styles.avatar} />
                {message.unread && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.userName}>{message.name}</Text>
                  <Text style={styles.messageTime}>{t.timeAgo(message.time)}</Text>
                </View>
                <Text style={[styles.messageText, message.unread && styles.unreadMessage]}>
                  {message.message}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 140}}>
          <View style={styles.gridInner}>
            {filteredMessages.map((message) => (
              <TouchableOpacity key={message.id} style={styles.gridItem}>
                <View style={styles.gridAvatarContainer}>
                  <Image source={{ uri: message.avatar }} style={styles.gridAvatar} />
                  {message.unread && <View style={styles.gridUnreadDot} />}
                </View>
                <Text style={styles.gridUserName} numberOfLines={1}>{message.name}</Text>
                <Text style={styles.gridMessageText} numberOfLines={2}>{message.message}</Text>
                <Text style={styles.gridTime}>{t.timeAgo(message.time)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {filteredMessages.length === 0 && (
        <View style={styles.emptyState}>
          <MessageCircle size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>{t.noMessages}</Text>
          <Text style={styles.emptySubtitle}>{t.emptySubtitle}</Text>
        </View>
      )}

      <View style={styles.viewToggle}>
        <TouchableOpacity 
          onPress={() => setViewMode('list')} 
          style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
        >
          <List size={20} color={viewMode === 'list' ? '#2563EB' : '#64748B'} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setViewMode('grid')} 
          style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
        >
          <Grid size={20} color={viewMode === 'grid' ? '#2563EB' : '#64748B'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  themeButton: {
    padding: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  languageButton: {
    padding: 6,
    borderRadius: 4,
  },
  languageText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: theme.text,
  },
  searchButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#2563EB',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  messageTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  messageText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: '500',
    color: theme.text,
  },
  gridContainer: {
    flex: 1,
    padding: 16,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    ...theme.shadow,
    alignItems: 'center',
  },
  gridAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  gridAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  gridUnreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#2563EB',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  gridUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  gridMessageText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  gridTime: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  viewToggle: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 4,
    ...theme.shadow,
  },
  viewButton: {
    padding: 8,
    borderRadius: 16,
  },
  activeViewButton: {
    backgroundColor: theme.surface,
  },
});