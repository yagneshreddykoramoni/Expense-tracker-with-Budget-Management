from django.utils import timezone

class RecentActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)
    activity_type = models.CharField(max_length=10)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, null=True)

    def save(self, *args, **kwargs):
        # Set the timestamp before saving
        if not self.timestamp:
            self.timestamp = timezone.now()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Delete the associated expense if this is an "add" activity
        if self.activity_type == 'add' and self.expense:
            self.expense.delete()
        super().delete(*args, **kwargs)

    @classmethod
    def post_save(cls, sender, instance, created, **kwargs):
        if created:
            # Get the most recent activity timestamp
            most_recent = RecentActivity.objects.filter(
                user=instance.user
            ).order_by('-timestamp').first()
            
            if most_recent:
                # Delete activities that are older than the most recent one
                # and keep only the 10 most recent activities
                RecentActivity.objects.filter(
                    user=instance.user,
                    timestamp__lt=most_recent.timestamp
                ).order_by('-timestamp')[10:].delete() 