# Generated by Django 5.2.3 on 2025-07-06 18:23

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_alter_applicant_first_name_alter_applicant_iin_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='TestResult',
        ),
    ]
