import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CourseOrganizationScreen: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('CS101');

  const courses = [
    { id: 'CS101', name: 'Intro to Programming', students: 45, lectures: 24, color: '#007AFF' },
    { id: 'MATH201', name: 'Calculus II', students: 32, lectures: 18, color: '#34C759' },
    { id: 'ENG102', name: 'English Composition', students: 28, lectures: 15, color: '#FF9500' },
  ];

  const modules = [
    { id: '1', title: 'Module 1: Introduction', lessons: 4, completed: true },
    { id: '2', title: 'Module 2: Variables & Data Types', lessons: 6, completed: true },
    { id: '3', title: 'Module 3: Control Flow', lessons: 5, completed: false },
    { id: '4', title: 'Module 4: Functions', lessons: 4, completed: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Course Organization</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal style={styles.courseTabs} showsHorizontalScrollIndicator={false}>
        {courses.map(course => (
          <TouchableOpacity
            key={course.id}
            style={[
              styles.courseTab,
              selectedCourse === course.id && { borderBottomColor: course.color },
            ]}
            onPress={() => setSelectedCourse(course.id)}
          >
            <Text
              style={[
                styles.courseTabText,
                selectedCourse === course.id && styles.courseTabTextActive,
              ]}
            >
              {course.id}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {courses
          .filter(c => c.id === selectedCourse)
          .map(course => (
            <View key={course.id} style={styles.courseDetails}>
              <Text style={styles.courseName}>{course.name}</Text>
              <View style={styles.courseStats}>
                <View style={styles.stat}>
                  <Ionicons name="people" size={18} color="#666" />
                  <Text style={styles.statText}>{course.students} students</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="videocam" size={18} color="#666" />
                  <Text style={styles.statText}>{course.lectures} lectures</Text>
                </View>
              </View>
            </View>
          ))}

        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Course Modules</Text>
          {modules.map(module => (
            <TouchableOpacity key={module.id} style={styles.moduleCard}>
              <View style={[styles.moduleStatus, module.completed && styles.moduleStatusComplete]}>
                <Ionicons
                  name={module.completed ? 'checkmark' : 'ellipse-outline'}
                  size={16}
                  color={module.completed ? '#FFF' : '#999'}
                />
              </View>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleLessons}>{module.lessons} lessons</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Add Module</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Syllabus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  courseTabs: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  courseTab: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  courseTabText: { fontSize: 14, color: '#666' },
  courseTabTextActive: { color: '#1A1A1A', fontWeight: '600' },
  content: { flex: 1 },
  courseDetails: { backgroundColor: '#FFF', padding: 20, marginBottom: 8 },
  courseName: { fontSize: 22, fontWeight: '600', color: '#1A1A1A' },
  courseStats: { flexDirection: 'row', marginTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  statText: { fontSize: 14, color: '#666', marginLeft: 6 },
  modulesSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  moduleStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleStatusComplete: { backgroundColor: '#34C759' },
  moduleInfo: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  moduleLessons: { fontSize: 12, color: '#666', marginTop: 2 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 24,
  },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 12, color: '#666', marginTop: 6 },
});

export default CourseOrganizationScreen;
