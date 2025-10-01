from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Item(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='items/', blank=True, null=True)
    available = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} ----- {self.category}"

class Table(models.Model):
    number = models.IntegerField(unique=True)

    def __str__(self):
        return f"میز {self.number}"

class CallWaiter(models.Model):
    table_number = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Table {self.table_number} called at {self.timestamp}"