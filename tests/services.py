from django.utils import timezone
from datetime import timedelta
from .models import TestSession

class TimeControlService:
    # Лимиты времени в минутах
    STAGE_TIME_LIMITS = {
        'Grammar': 20,
        'Vocabulary': 20,
        'Reading': 15,
    }
    
    # Общий лимит времени для всей сессии (в минутах)
    SESSION_TIME_LIMIT = 60
    
    @classmethod
    def get_stage_duration(cls, test_session, stage_type):
        """Получить продолжительность этапа в минутах"""
        if stage_type == 'Grammar':
            start_time = test_session.grammar_started_at
            end_time = test_session.grammar_finished_at
        elif stage_type == 'Vocabulary':
            start_time = test_session.vocabulary_started_at
            end_time = test_session.vocabulary_finished_at
        elif stage_type == 'Reading':
            start_time = test_session.reading_started_at
            end_time = test_session.reading_finished_at
        else:
            return None
            
        if not start_time:
            return None
            
        if end_time:
            duration = end_time - start_time
        else:
            duration = timezone.now() - start_time
            
        return duration.total_seconds() / 60  # в минутах
    
    @classmethod
    def get_session_duration(cls, test_session):
        """Получить продолжительность всей сессии в минутах"""
        if not test_session.started_at:
            return None
            
        if test_session.finished_at:
            duration = test_session.finished_at - test_session.started_at
        else:
            duration = timezone.now() - test_session.started_at
            
        return duration.total_seconds() / 60  # в минутах
    
    @classmethod
    def is_stage_time_exceeded(cls, test_session, stage_type):
        """Проверить, превышен ли лимит времени для этапа"""
        duration = cls.get_stage_duration(test_session, stage_type)
        if duration is None:
            return False
            
        limit = cls.STAGE_TIME_LIMITS.get(stage_type)
        return duration > limit if limit else False
    
    @classmethod
    def is_session_time_exceeded(cls, test_session):
        """Проверить, превышен ли общий лимит времени сессии"""
        duration = cls.get_session_duration(test_session)
        if duration is None:
            return False
            
        return duration > cls.SESSION_TIME_LIMIT
    
    @classmethod
    def get_remaining_time(cls, test_session, stage_type):
        """Получить оставшееся время для этапа в минутах"""
        duration = cls.get_stage_duration(test_session, stage_type)
        if duration is None:
            return cls.STAGE_TIME_LIMITS.get(stage_type, 0)
            
        limit = cls.STAGE_TIME_LIMITS.get(stage_type, 0)
        remaining = max(0, limit - duration)
        return remaining
    
    @classmethod
    def get_session_remaining_time(cls, test_session):
        """Получить оставшееся время для всей сессии в минутах"""
        duration = cls.get_session_duration(test_session)
        if duration is None:
            return cls.SESSION_TIME_LIMIT
            
        remaining = max(0, cls.SESSION_TIME_LIMIT - duration)
        return remaining
    
    @classmethod
    def can_start_stage(cls, test_session, stage_type):
        """Проверить, можно ли начать этап"""
        # Проверяем, не превышен ли общий лимит времени
        if cls.is_session_time_exceeded(test_session):
            return False, "Session time limit exceeded"
            
        # Проверяем, не превышен ли лимит времени для конкретного этапа
        if cls.is_stage_time_exceeded(test_session, stage_type):
            return False, f"{stage_type} stage time limit exceeded"
            
        return True, "Stage can be started"
    
    @classmethod
    def validate_stage_completion(cls, test_session, stage_type):
        """Валидировать завершение этапа"""
        # Проверяем, что этап был начат
        if stage_type == 'Grammar' and not test_session.grammar_started_at:
            return False, f"{stage_type} stage was not started"
        elif stage_type == 'Vocabulary' and not test_session.vocabulary_started_at:
            return False, f"{stage_type} stage was not started"
        elif stage_type == 'Reading' and not test_session.reading_started_at:
            return False, f"{stage_type} stage was not started"
            
        # Проверяем, что этап еще не завершен
        if stage_type == 'Grammar' and test_session.grammar_finished_at:
            return False, f"{stage_type} stage already finished"
        elif stage_type == 'Vocabulary' and test_session.vocabulary_finished_at:
            return False, f"{stage_type} stage already finished"
        elif stage_type == 'Reading' and test_session.reading_finished_at:
            return False, f"{stage_type} stage already finished"
            
        return True, "Stage can be finished"
    
    @classmethod
    def is_session_complete(cls, test_session):
        """Проверить, завершена ли вся сессия (все этапы)"""
        return (
            test_session.grammar_finished_at and
            test_session.vocabulary_finished_at and
            test_session.reading_finished_at
        )
    
    @classmethod
    def get_session_status(cls, test_session):
        """Получить статус сессии"""
        status = {
            'session_started': bool(test_session.started_at),
            'session_finished': bool(test_session.finished_at),
            'session_duration': cls.get_session_duration(test_session),
            'session_remaining_time': cls.get_session_remaining_time(test_session),
            'stages': {}
        }
        
        for stage_type in ['Grammar', 'Vocabulary', 'Reading']:
            status['stages'][stage_type] = {
                'started': bool(getattr(test_session, f'{stage_type.lower()}_started_at')),
                'finished': bool(getattr(test_session, f'{stage_type.lower()}_finished_at')),
                'duration': cls.get_stage_duration(test_session, stage_type),
                'remaining_time': cls.get_remaining_time(test_session, stage_type),
                'time_exceeded': cls.is_stage_time_exceeded(test_session, stage_type)
            }
            
        return status 